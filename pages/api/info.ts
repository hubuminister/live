// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const api = axios.create({
  timeout: 3000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Mobile Safari/537.36",
    Authorization:
      "Basic OTM5NjI0NDM6ckgyMDZzKytPMFR2S2hwcU1pRTMvM1Q4ZStSYytVNkhLdFNLU1ZLNDU5RWxKT2k5NmtmT0ZDT1B0QkRlOWFaVG9weVBpUzQ4dkJBTjBSUVEyR21KYndKandsRDRPSzdUbTMzcFJoVEJ1bXdwVktTV3J3OHRnNXdQUUczcjFyVDZJUTY0aE5WTXlqMjZtb0JRVmdpcUhHVitYa0NwZEFQbk10NHFqdWJRc0RZdXhYSDZIaGMzTHhEMmxJQkJpTEtTY2Evc1duQWcvcG5SSGhKSjJmQ3NIZ09GbUoxdk1lZVM4TUlJNFZ5SmFoaE1rTUdIdkt1R2FWM3RTRkdDVWljYU1yM2ZaMGFJcjVodm9xR2l1eTZZa29CZXlmQllrT3ZQTStUbmJ5MmdVODZsSGU5UkI5ZW5iVDF5THNQYzVPbGYrQzJ5bVBaYmFZbGtoK25zZGZqQUg0MTNyQU9jNVVMZ3BJdDU3SjIreTNDR0FGS0U5ME05cyswdUJ6eW9pS0FGVlFQVjA0amxKNWdaYXpOSjN6UFNGcmsx",
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
