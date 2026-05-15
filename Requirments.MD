1. 我有一个worker follownewfei 已经运行在cloudflare上， 我需要开发一个新的worker（autoplacement), 来定时控制fllownewfei的placement
2. follownewfei 和 autoplacement都在同一个账户下
3. autoplacement定期执行。能实现
| **北京时间 (CST)**    | **GCP 区域 ID**          |
| ----------------- | ---------------------- |
| **06:30 - 14:00** | `europe-west3`         |
| **其它时间**      | `us-central1`          |
