const sharp = require("sharp");

const maxAvatarSize = process.env.AVATAR_MAXSIZE;
const maxAvatarFileSize = process.env.AVATAR_MAXFSIZE;

const maxBannerSize = process.env.BANNER_MAXSIZE;
const maxBannerFileSize = process.env.BANNER_MAXFSIZE;

const maxDefaultSize = process.env.DEFAULTIMAGE_MAXSIZE;
const maxDefaultFileSize = process.env.DEFAULTIMAGE_MAXFSIZE;

const CompressImage = async (image, type) => {

    let maxSize;
    let maxFileSize;
    switch (type) {
        case "avatar":
            maxSize = maxAvatarSize;
            maxFileSize = maxAvatarFileSize;
            break;
        case "banner":
            maxSize = maxBannerSize;
            maxFileSize = maxBannerFileSize;
            break;
        default:
            maxSize = maxDefaultSize;
            maxFileSize = maxDefaultFileSize;
            break;
    }

    const buffer = sharp(image, { animated: true });
    try {
        if (!buffer) return { data: null, message: "Error compressing image. Is it the right format ?" };

        const metadata = await buffer.metadata();
        if (!metadata) return { data: null, message: "Error compressing image. Is it the right format ?" };

        let height = Math.floor(metadata?.pageHeight ?? metadata.height);
        let width = Math.floor(metadata.width);

        let targetheight = height;
        let targetwidth = width;
        let ratio = 1;
        switch (type) {
            case "avatar":
                if (width > targetheight) targetheight = width;
                if (targetheight > maxSize) targetheight = maxSize;
                targetwidth = targetheight;
                break;
            case "banner":
                targetheight = Math.min(targetheight, maxSize);
                targetwidth = targetheight * 3;
                break;
            default:
                if (height > width) {
                    if (height > maxSize) {
                        targetheight = maxSize;
                        ratio = height / targetheight;
                        targetwidth /= ratio;
                    }
                }
                else {
                    if (width > maxSize) {
                        targetwidth = maxSize;
                        ratio = width / targetwidth;
                        targetheight /= ratio;
                    }
                }
                break;
        }

        let quality = 75;
        let output = await buffer
            .resize({
                width: Number(targetwidth),
                height: Number(targetheight),
                fit: 'cover'
            })
            .webp({ quality })
            .toBuffer();

        while (output.length > maxFileSize * 1024 && quality > 10) {
            quality -= 5;
            output = await buffer
                .resize({
                    width: Number(targetwidth),
                    height: Number(targetheight),
                    fit: "cover"
                })
                .webp({ quality })
                .toBuffer();
        }

        if (output.length > maxFileSize * 1024) return { data: null, message: "File size exceeds " + maxFileSize + "KB" };

        return { data: output };
    } catch (err) {
        if (process.env.LOGERRORS === 'true') console.error(err);
        return { data: null, message: "Error compressing image. Is it the right format ?" };
    }
};

module.exports = { CompressImage };