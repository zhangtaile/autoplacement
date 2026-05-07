interface Env {
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
  TARGET_WORKER_NAME: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const now = new Date();
    const utcHour = now.getUTCHours();

    /**
     * 需求 (北京时间 UTC+8):
     * 00:00 - 08:00 -> 西欧 (gcp:europe-west1)
     * 08:00 - 16:00 -> 美西 (gcp:us-west1)
     * 16:00 - 00:00 -> 大洋洲 (gcp:australia-southeast1)
     * 
     * 换算为 UTC 时间 (北京时间 - 8 小时):
     * 北京 00:00 = UTC 16:00 (前一天)
     * 北京 08:00 = UTC 00:00
     * 北京 16:00 = UTC 08:00
     */
    let targetRegion = '';
    if (utcHour >= 16) {
      // 北京 00:00 - 08:00
      targetRegion = 'gcp:europe-west1';
    } else if (utcHour < 8) {
      // 北京 08:00 - 16:00
      targetRegion = 'gcp:us-west1';
    } else {
      // 北京 16:00 - 00:00
      targetRegion = 'gcp:australia-southeast1';
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
