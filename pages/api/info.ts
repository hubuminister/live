// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const api = axios.create({
  timeout: 3000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Mobile Safari/537.36",
    Authorization:
      "Basic OTM5NjI0NDM6ckgwNFEvNDBsUHQxNStGQ2N0STRSL0ZNbk1jWTYwUFBRUjlRRUYvR3ZadWlSbUJ6MjU5R1l5bjU5YS9oS3cyZk0rdVZ4cmJtSU40Y3BYRlZZcWVyNFB6LzRnTjFEOG1vMy9jVHM0elQxWE1kRHJ1TVB2YnRWUjVic3BHaDA2dFl1OGEyd21rbVlQSnAxMFNwdVdjODl0TFdqUkpUNm9mOGJtYitoSWxYLzVFaUdOTFB5MTYzMm42QnJlYkR3L1E4Q0wxQmkyaWJrNm5QUHdVN2xYUXRSM2lMZTNlamJ2MWg2WXpXWGprT0VOakxwOSt5SWpDVEx3Z3dJS3QxcU5keENidC82UHZUaytMUkJiYzRLdVdkSERjVVhKNTJLL01SUHIyTS8rR0laOUZ2Q2lNN3NmMzN5NXFNUVlWL1Job05ydFNqelBCYVZkWGcwR2JSb3dMTEgrd2pNQ2QrVUxzZUY1NktHNDdXQU02M2NRRnpJclBKcmloaGZRV1FYS200clJ3Z1JJQXdjUFNTeHNqaHpxa3Uzdk1V",
  },
});

const apis = {
  info: (uid: number) =>
    api.get(
      `https://argo.blued.cn/users/${uid}?is_living=false&is_call=0&is_shadow=0&is_vip_page=0`
    ),
  userinfo: (uid: number) =>
    api.get(`https://live.blued.cn/live/user/card?anchor=${uid}&uid=${uid}`),
  consumes: (uid: number, lid: number, page: number = 1) =>
    api.get(
      `https://live.blued.cn/live/stars/${uid}/consumes?page=${page}&lid=${lid}&type=month`
    ),
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { data } = await apis.info(Number(req.query.id));
  if (data.code !== 200) return res.status(404).json({ error: "Not found" });
  const resData: { [key: string]: any } = {
    name: data.data[0].name,
    avatar: data.data[0].raw_avatar,
  };
  if (data.data[0].live) {
    let page = 1;
    let consumes: any[] = [];
    while (page < 6) {
      const { data: consumeInfo } = await apis.consumes(
        Number(req.query.id),
        data.data[0].live,
        page
      );
      if (consumeInfo.code !== 200) break;
      consumes = consumes.concat(consumeInfo.data);
      page++;
    }
    resData.consume = consumes;
    let total = 0;
    consumes.forEach((consume) => {
      total += parseInt(consume.beans);
    });
    resData.total = total;
  }
  res.status(200).json(resData);
}
