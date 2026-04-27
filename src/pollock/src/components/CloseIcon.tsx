export default function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 1L14 14M14 1L1 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
