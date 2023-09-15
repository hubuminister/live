// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const api = axios.create({
  timeout: 3000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Mobile Safari/537.36",
    Authorization:
      "Basic OTM5NjI0NDM6ckgyVENUb0VUZEhQMHBGUkxZenFTeCtmZUw1dWZ5MVlZVGFUSGRFN0V4VW1SSi9JdHVpb3hsUWZOL0tDQUxSZkJQSnZWeDRKYWhEcU1XSW9CbmhiWlZlZ1ZSdlZxMHRsTndwNFZobHZoUG9rSTRtNDhXcXM3K0U2VWhzcUtsSEYxL1NuZElLcVc2TXJ5YmF1ZTkwd2FMbHQ5OUZ0RXdmYWRwMlRXYy9aQytyWXJjdDV6dENCUiszaHpyT2dmRHFqcThwSi95ditCQzlSaEl5WGtnTU1rbTV6T1AzSG5xMlFmWHFPM1NkbVc4Uml2azFuSWYyTXB6cjN6ZFczcFdGRi9FOFBSNEg4bzF2NmZ5elpscFZtM2k5UFJQVmQwUEw4NXVaeGxlYjFTZEswa2tZTDZCbTNWVGpBR1Z6WXUvaHU1ZGpsVDZieVQ2MkdPNlRZaklGcFRRQ08zRE4rRmlmQUF0Smg1Wk5xQWR4M3BHaXJ2dWx1aXp3VUY3RzB3bEY1RlRLQ3FPTTNqZ1hVblg2S0lIdDh4MnRL",
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
