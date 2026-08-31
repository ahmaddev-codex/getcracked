/**
 * Loading progress bar component
 * 
 * A centered horizontal progress bar with fill animation for loading states
 */
export function LoadingBar() {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="gc-loading-bar w-full max-w-xs">
        <div className="gc-loading-bar-fill" />
      </div>
    </div>
  );
}