interface Env {
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
  TARGET_WORKER_NAME: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const now = new Date();
    // 使用 UTC 分钟数以获得更高精度 (CST = UTC + 8)
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

    /**
     * 需求 (北京时间 CST):
     * 21:30 - 05:30 -> 大洋洲 (gcp:australia-southeast1) | UTC 13:30 - 21:30 (810 - 1290 min)
     * 05:30 - 13:00 -> 欧洲   (gcp:europe-west3)         | UTC 21:30 - 05:00 (1290 - 300 min)
     * 13:00 - 21:30 -> 美国   (gcp:us-central1)          | UTC 05:00 - 13:30 (300 - 810 min)
     */
    let targetRegion = '';
    if (utcMinutes >= 810 && utcMinutes < 1290) {
      targetRegion = 'gcp:australia-southeast1';
    } else if (utcMinutes >= 300 && utcMinutes < 810) {
      targetRegion = 'gcp:us-central1';
    } else {
      targetRegion = 'gcp:europe-west3';
    }

    console.log(`Current UTC Time: ${now.toISOString()}, Target Region: ${targetRegion}`);

    const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${env.TARGET_WORKER_NAME}/settings`;

    try {
      // 执行更新 (直接无脑覆盖，确保状态符合预期)
      console.log(`Setting placement to ${targetRegion} for ${env.TARGET_WORKER_NAME}...`);
      
      const formData = new FormData();
      formData.append('settings', JSON.stringify({
        placement: {
          mode: 'targeted',
          region: targetRegion
        }
      }));

      const patchResponse = await fetch(baseUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        },
        body: formData
      });

      if (!patchResponse.ok) {
        const errorText = await patchResponse.text();
        throw new Error(`Failed to update settings: ${patchResponse.status} ${errorText}`);
      }

      console.log(`Successfully updated placement to ${targetRegion}.`);
    } catch (error) {
      console.error(`Error in autoplacement worker:`, error);
    }
  },

  // 方便手动触发测试
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    await this.scheduled({} as any, env, ctx);
    return new Response("Placement check executed manually.");
  }
};
