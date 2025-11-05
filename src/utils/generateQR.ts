import QRCode from "qrcode";

export const generateQR = async (url: string) => {
  return await QRCode.toDataURL(url);
};
