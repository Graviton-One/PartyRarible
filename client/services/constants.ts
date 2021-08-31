export interface Chain {
  exchange: string
  partyFactory: string
  nftContract: string
  vaultFactory: string
  weth: string
  transferProxy: string
  erc20TransferProxy: string
}

export const PLG: Chain = {
  exchange: "0xa0447ee66e44bf567ff9287107b0c3d2f88efd93",
  partyFactory: "0x94CE3811D45D57B742C5197e1A1645E6B74D864B",
  nftContract: "0x8d712f350A55D65427EfcE56Ec6a36fef28e8Ac9",
  weth: "0x1b3223c54f04543bc656a2c2c127576f314b5449",
  vaultFactory: "0x7fCCE1303F7e1fc14780C87F6D67346EC44a4027",
  transferProxy: "0x91b1fc5fb6913a3bd94d6381f0928b7f43753b1b",
  erc20TransferProxy: "0x4ab096f49f2af3cfcf2d851094fa5936f18aed90",
}

export const RKB: Chain = {
  exchange: "0x12e0AA009024C5e6D1b12F677E2cD99A2284080a",
  partyFactory: "0x9d2f7Dc325898E50D32783a95654eb377c994253",
  nftContract: "0x053F7Dc4c2BC0bA064071E1B6D080df4F0AA46f9",
  weth: "0xdf032bc4b9dc2782bb09352007d4c57b75160b15",
  vaultFactory: "0x458556c097251f52ca89cB81316B4113aC734BD1",
  transferProxy: "0x9a0B9184c65E508344D2A75adaED4a73Ce2Cd256",
  erc20TransferProxy: "0x0dc7f26FE9C3e07dd3650eCa942cbBb53093d860",
}
