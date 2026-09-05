export class OctaneVersion
{
    public static RENDERER_VERSION: string = '3.6.0';
    public static UI_VERSION: string = '3.6.0';

    public static sayHello(): void
    {
        if(navigator.userAgent.toLowerCase().indexOf('chrome') > -1)
        {
            const args = [
                `\n %c  OCTANE  %c  UI ${OctaneVersion.UI_VERSION}  %c  Renderer ${OctaneVersion.RENDERER_VERSION}  %c \n`,
                'background: #1a3a5c; color: #ffffff; font-size: 14px; font-weight: bold; padding: 8px 12px; border-radius: 6px 0 0 6px;',
                'background: #2a5f8f; color: #e0ecf8; font-size: 12px; padding: 8px 10px;',
                'background: #3d7ab5; color: #e0ecf8; font-size: 12px; padding: 8px 10px; border-radius: 0 6px 6px 0;',
                'background: transparent;'
            ];

            self.console.log(...args);
        }
        else if(self.console)
        {
            self.console.log(`Octane UI ${OctaneVersion.UI_VERSION} - Renderer ${OctaneVersion.RENDERER_VERSION}`);
        }
    }
}
