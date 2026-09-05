export { };

declare global
{
    interface Window
    {
        OctaneConfig?: Record<string, unknown>;
    }
}
