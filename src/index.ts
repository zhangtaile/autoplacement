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
     * 需求：
     * 北京时间 9:00 - 16:00 -> gcp:europe-west3
     * 其他时间 -> gcp:us-east1
     * 
     * 换算为 UTC 时间 (北京时间 - 8 小时):
     * 北京 09:00 = UTC 01:00
     * 北京 16:00 = UTC 08:00
     */
    const isWorkingHours = utcHour >= 1 && utcHour < 8;
    const targetRegion = isWorkingHours ? 'gcp:europe-west3' : 'gcp:us-east1';

    console.log(`Current UTC Time: ${now.toISOString()}, Target Region: ${targetRegion}`);

    const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${env.TARGET_WORKER_NAME}/settings`;
    const headers = {
      'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    };

    try {
      // 1. 获取当前配置
      console.log(`Checking current placement for ${env.TARGET_WORKER_NAME}...`);
      const getResponse = await fetch(baseUrl, { headers });
      
      if (!getResponse.ok) {
        const errorText = await getResponse.text();
        throw new Error(`Failed to fetch settings: ${getResponse.status} ${errorText}`);
      }

      const config: any = await getResponse.json();
      const currentPlacement = config.result?.placement;

      console.log(`Current placement object: ${JSON.stringify(currentPlacement)}`);
      
      // 根据日志显示，如果设置了 region，返回值可能会出现在 currentPlacement.target 或 currentPlacement.region
      // 我们优先检查 region 字符串，如果不存在则判断是否需要强制更新
      const currentRegion = currentPlacement?.region;
      console.log(`Current placement: mode=${currentPlacement?.mode}, region=${currentRegion}`);

      // 2. 判断是否需要更新
      // 由于 API 返回的 'target' 可能是不直观的 ID，我们通过比较 mode 和 region 字符串来决定
      if (
        currentPlacement?.mode === 'targeted' && 
        currentRegion === targetRegion
      ) {
        console.log(`Placement is already set to ${targetRegion}. Skipping update.`);
        return;
      }

      // 3. 执行更新
      console.log(`Updating placement to ${targetRegion}...`);
      
      const formData = new FormData();
      // 明确设置 mode 为 targeted 并指定 region
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

      console.log(`Successfully updated placement for ${env.TARGET_WORKER_NAME} to ${targetRegion}.`);
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
