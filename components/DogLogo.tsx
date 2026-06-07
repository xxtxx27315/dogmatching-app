export default function DogLogo({ size = 32 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/assets/dogs-heart.png"
      alt="ドッグLIFE"
      width={size}
      height={size}
      style={{ width: size, height: "auto", objectFit: "contain" }}
    />
  );
}
