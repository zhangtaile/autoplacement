1. 我有一个worker follownewfei 已经运行在cloudflare上， 我需要开发一个新的worker（autoplacement), 来定时控制fllownewfei的placement
2. follownewfei 和 autoplacement都在同一个账户下
3. autoplacement定期执行。能实现
| **北京时间 (CST)**    | **GCP 区域 ID**          |
| ----------------- | ---------------------- |
| **21:30 - 05:30** | `australia-southeast1` |
| **05:30 - 13:00** | `europe-west3`         |
| **13:00 - 21:30** | `us-central1`          |
