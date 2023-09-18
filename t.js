const ipregion = require("ip2region");
const ip2region = new ipregion.default();
const ip = "36.248.233.171";
const region = ip2region.search(ip);
console.log(region);