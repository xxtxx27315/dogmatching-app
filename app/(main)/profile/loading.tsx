export default function ProfileLoading() {
  return (
    <div className="animate-pulse bg-white min-h-full">
      <div className="px-4 py-5 flex gap-4">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex-none" />
        <div className="flex-1 space-y-2 pt-2">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-full bg-gray-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
