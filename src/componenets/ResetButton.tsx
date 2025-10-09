type ResetButtonProps = {
  onClick: () => void;
};

export function ResetButton({ onClick }: ResetButtonProps) {
  return (
    <button
      onClick={onClick}
      className="absolute top-14 left-3 bg-gray-800 text-white px-3 py-1 rounded cursor-pointer z-50 hover:bg-gray-700"
    >
      Reset
    </button>
  );
}
