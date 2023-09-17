type IdleStatus = {
    availability: 'initializing';
} | {
    availability: 'available';
    isUserActive: boolean;
    lastActiveTime: number;
} | {
    availability: 'unavailable';
    error: 'not-supported';
};

export default function useIdleStatus(): IdleStatus
{
    return null!;
}