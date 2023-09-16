// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const api = axios.create({
  timeout: 3000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Mobile Safari/537.36",
    Authorization:
      "Basic OTM5NjI0NDM6ckgxTGtLVFNyMFJRdkorVEtwSnRDQm5uVVFxWitPcXlobmhNNG11VFZYTGJBdGtydTNRSHppWjRsUHFCTDhnR2ZqdHNOR1RYTm9TcGI2MmJmMW1OWEh1cHVIVlZJT3l5QnU4R21DZU1CdXpDTStvaDlZMW51cmpkOUgzWUYwZEpUcUFDZU8zRWprNmJKY0YvT09UNWN5Mld1OTZ3ZDRPWEVDaGhiUGsrbXB3Wk1wcTg3Q2wrM2VxZk1rVW5vVUVvdU44cWlYNFVOQ0RvMk55NGQveTd6dkJ5RURYVjVHc0dGWDg4QVg1RUVvRnV3eGR6RGVwTGkxbmVteWZXRVErRDZ0WVdsQ3RXRVVYNVNtMW83V1IwbE9EZ2l5OWFUR1BkT1hybGpTOHBLcWVTRk00WVFLQXE3aXVOUTltUURHVktJTTR4dWRMSG1kMkFqcEtNN29rWFRLcE80VlN3R3Faa25YbWI5bE13NFczVEQ5ZnAvdUxBWUg0T1pZQmZldENTUmIrcFNDblAwRTFkSjVXTU9QVWhBQzU5",
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
