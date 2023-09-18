// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const api = axios.create({
  timeout: 3000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Mobile Safari/537.36",
    Authorization:
      "Basic OTM5NjI0NDM6ckgyVnUySFhJaEE1VXg4WldsRkJDanBRZ3JCdXFYcFhVUkErblFXUFVUKzZPazZzZ2J1ZCs2UGtLeWNxL3A4cVpkeXpKRnkyK2FVc0hhWUg2TjFFcWZsK3FKamx4Y2t0Z2MyYWFTdjlyS3Z2am9sUGdtZWtiaFdXOGx4bFVHWjMyZC9HeVlsci9jUVE3MXlwSitCNW5QTkxjcXFJcjBEcExEZmFZeHI1bElua0Z2VXZPNGNLTlZQbEk0VWF1T01rTVlpelYrdUQvS0cwWUpiWUc0WHFsVHQzUnJOUndTTjZ0UTZNMGp3aFlhWHJTNUVpZGNBKy9lR01nQmdlcm9rS3pJUFNaWTJReGhWd0lDNWQ4NklHMkxWMHM4bmtxOE1JbWVEY2pnc1NWUnZaOEtsZWkyMEFYQ29rbk5sRVBObjlxaGhJMmRZVGxuVGZEbDJrY0NFSFdkL041SFZFbStpaDQ5WlQwSW1XZ2RpdExtYk1teGZnV01PSmErSjdpN1hlZFdqdE4zQVNoN1dNalZqc3JDYWpLVitm",
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
  currentConsume: (uid: number, lid: number, page: number = 1) =>
    api.get(
      `https://live.blued.cn/live/stars/${uid}/consumes/${lid}?page=${page}`
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
    let currentConsumes: any[] = [];
    while (page < 6) {
      const { data: consumeInfo } = await apis.consumes(
        Number(req.query.id),
        data.data[0].live,
        page
      );
      if (consumeInfo.code !== 200) break;
      consumes = consumes.concat(consumeInfo.data);
      const { data: currentConsumeInfo } = await apis.currentConsume(
        Number(req.query.id),
        data.data[0].live,
        page
      );
      if (currentConsumeInfo.code !== 200) break;
      currentConsumes = currentConsumes.concat(currentConsumeInfo.data);
      page++;
    }
    resData.consume = consumes;
    resData.currentConsume = currentConsumes;
    let total = 0;
    consumes.forEach((consume) => {
      total += parseInt(consume.beans);
    });
    resData.total = total;
    let currentTotal = 0;
    currentConsumes.forEach((consume) => {
      currentTotal += parseInt(consume.beans);
    });
    resData.currentTotal = currentTotal;
  }
  res.status(200).json(resData);
}
