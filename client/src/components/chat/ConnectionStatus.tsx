import { type ConnectionStatus as ConnectionStatusType } from '@/lib/socket';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'connected':
        return {
          dot: 'bg-green-500 animate-pulse'
        };
      case 'connecting':
        return {
          dot: 'bg-amber-500 animate-pulse'
        };
      case 'disconnected':
        return {
          dot: 'bg-red-500'
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <span className="flex items-center">
      <span className={`h-2 w-2 rounded-full ${styles.dot} mr-1.5 inline-block shadow-sm`}></span>
    </span>
  );
}
