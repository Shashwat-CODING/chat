import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface ConnectionErrorModalProps {
  isOpen: boolean;
  onRetry: () => void;
}

export function ConnectionErrorModal({ isOpen, onRetry }: ConnectionErrorModalProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </div>
          <AlertDialogTitle className="text-xl font-semibold text-gray-800 text-center mb-2">
            Connection Lost
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 text-center">
            We're having trouble connecting to the server. Please check your internet connection.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="justify-center">
          <AlertDialogAction
            onClick={onRetry}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-6 py-2 font-medium"
          >
            Retry Connection
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConnectionErrorModal;
