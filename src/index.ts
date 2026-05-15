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
     * 需求分布:
     * 北京时间 (CST) | UTC 时间        | 区域 (GCP Region)           | 当地时间 (Local)
     * 06:30 - 14:00 | 22:30 - 06:00 | europe-west3 (法兰克福)      | 23:30 - 07:00 (CET)
     * 其它时间      | 其它时间      | us-central1 (爱荷华)         | -
     */
    let targetRegion = '';
    // 06:30 CST = 22:30 UTC = 1350 min
    // 14:00 CST = 06:00 UTC = 360 min
    // 跨越午夜: 22:30 (1350) -> 24:00 (1440) -> 06:00 (360)
    if (utcMinutes >= 1350 || utcMinutes < 360) {
      targetRegion = 'gcp:europe-west3';
    } else {
      targetRegion = 'gcp:us-central1';
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
