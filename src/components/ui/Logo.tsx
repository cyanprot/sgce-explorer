interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 32, className }: LogoProps) {
  return (
    <img
      src="/images/logo.svg"
      alt="Arcivus logo"
      width={size}
      height={size}
      className={className}
    />
  );
}
