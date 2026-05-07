1. 我有一个worker follownewfei 已经运行在cloudflare上， 我需要开发一个新的worker（autoplacement), 来定时控制fllownewfei的placement
2. follownewfei 和 autoplacement都在同一个账户下
3. autoplacement定期执行。能实现
  1. 北京时间9：00 到16：00 使用 gcp:europe-west3
  2. 其他时间使用gcp:us-east1
