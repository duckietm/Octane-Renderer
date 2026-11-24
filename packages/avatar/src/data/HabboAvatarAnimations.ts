const snowWarHeadOffsets = (front: boolean) => [0, 1, 2, 3].map(frame =>
{
    const hidden = frame > 1;
    return {
        'id': frame,
        ...(frame === 3 ? { 'repeats': 100 } : {}),
        'directions': [0, 2, 4, 6].map(direction => ({
            'id': direction,
            'bodyParts': [{
                'id': 'head',
                'dx': hidden ? -100 : ((direction < 3) === front ? 10 : -10),
                'dy': (direction === 0 || direction === 6) ? 4 : 5
            }]
        }))
    };
});

export const HabboAvatarAnimations = {
    'animations': [
        {
            'id': 'Default',
            'parts': [
                {
                    'setType': 'ch',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'cc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'mc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'mco',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'mcu',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'ls',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'lc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'mcl',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'rs',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'rc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'mcr',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'ha',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'he',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'wa',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'pt',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'ptl',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'ptr',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                }
            ]
        },
        {
            'id': 'Sit',
            'parts': [
                {
                    'setType': 'ch',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'sit' },
                        { 'number': 1, 'assetPartDefinition': 'sit' },
                        { 'number': 2, 'assetPartDefinition': 'sit' },
                        { 'number': 3, 'assetPartDefinition': 'sit' },
                        { 'number': 4, 'assetPartDefinition': 'sit' },
                        { 'number': 5, 'assetPartDefinition': 'sit' },
                        { 'number': 6, 'assetPartDefinition': 'sit' },
                        { 'number': 7, 'assetPartDefinition': 'sit' }
                    ]
                },
                {
                    'setType': 'cc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'sit' },
                        { 'number': 1, 'assetPartDefinition': 'sit' },
                        { 'number': 2, 'assetPartDefinition': 'sit' },
                        { 'number': 3, 'assetPartDefinition': 'sit' },
                        { 'number': 4, 'assetPartDefinition': 'sit' },
                        { 'number': 5, 'assetPartDefinition': 'sit' },
                        { 'number': 6, 'assetPartDefinition': 'sit' },
                        { 'number': 7, 'assetPartDefinition': 'sit' }
                    ]
                },
                {
                    'setType': 'mc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'sit' },
                        { 'number': 1, 'assetPartDefinition': 'sit' },
                        { 'number': 2, 'assetPartDefinition': 'sit' },
                        { 'number': 3, 'assetPartDefinition': 'sit' },
                        { 'number': 4, 'assetPartDefinition': 'sit' },
                        { 'number': 5, 'assetPartDefinition': 'sit' },
                        { 'number': 6, 'assetPartDefinition': 'sit' },
                        { 'number': 7, 'assetPartDefinition': 'sit' }
                    ]
                },
                {
                    'setType': 'mco',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'sit' },
                        { 'number': 1, 'assetPartDefinition': 'sit' },
                        { 'number': 2, 'assetPartDefinition': 'sit' },
                        { 'number': 3, 'assetPartDefinition': 'sit' },
                        { 'number': 4, 'assetPartDefinition': 'sit' },
                        { 'number': 5, 'assetPartDefinition': 'sit' },
                        { 'number': 6, 'assetPartDefinition': 'sit' },
                        { 'number': 7, 'assetPartDefinition': 'sit' }
                    ]
                },
                {
                    'setType': 'mcu',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'sit' },
                        { 'number': 1, 'assetPartDefinition': 'sit' },
                        { 'number': 2, 'assetPartDefinition': 'sit' },
                        { 'number': 3, 'assetPartDefinition': 'sit' },
                        { 'number': 4, 'assetPartDefinition': 'sit' },
                        { 'number': 5, 'assetPartDefinition': 'sit' },
                        { 'number': 6, 'assetPartDefinition': 'sit' },
                        { 'number': 7, 'assetPartDefinition': 'sit' }
                    ]
                },
                {
                    'setType': 'ls',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'sit' },
                        { 'number': 1, 'assetPartDefinition': 'sit' },
                        { 'number': 2, 'assetPartDefinition': 'sit' },
                        { 'number': 3, 'assetPartDefinition': 'sit' },
                        { 'number': 4, 'assetPartDefinition': 'sit' },
                        { 'number': 5, 'assetPartDefinition': 'sit' },
                        { 'number': 6, 'assetPartDefinition': 'sit' },
                        { 'number': 7, 'assetPartDefinition': 'sit' }
                    ]
                },
                {
                    'setType': 'rs',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'sit' },
                        { 'number': 1, 'assetPartDefinition': 'sit' },
                        { 'number': 2, 'assetPartDefinition': 'sit' },
                        { 'number': 3, 'assetPartDefinition': 'sit' },
                        { 'number': 4, 'assetPartDefinition': 'sit' },
                        { 'number': 5, 'assetPartDefinition': 'sit' },
                        { 'number': 6, 'assetPartDefinition': 'sit' },
                        { 'number': 7, 'assetPartDefinition': 'sit' }
                    ]
                },
                {
                    'setType': 'ha',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'sit' },
                        { 'number': 1, 'assetPartDefinition': 'sit' },
                        { 'number': 2, 'assetPartDefinition': 'sit' },
                        { 'number': 3, 'assetPartDefinition': 'sit' },
                        { 'number': 4, 'assetPartDefinition': 'sit' },
                        { 'number': 5, 'assetPartDefinition': 'sit' },
                        { 'number': 6, 'assetPartDefinition': 'sit' },
                        { 'number': 7, 'assetPartDefinition': 'sit' }
                    ]
                },
                {
                    'setType': 'he',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'sit' },
                        { 'number': 1, 'assetPartDefinition': 'sit' },
                        { 'number': 2, 'assetPartDefinition': 'sit' },
                        { 'number': 3, 'assetPartDefinition': 'sit' },
                        { 'number': 4, 'assetPartDefinition': 'sit' },
                        { 'number': 5, 'assetPartDefinition': 'sit' },
                        { 'number': 6, 'assetPartDefinition': 'sit' },
                        { 'number': 7, 'assetPartDefinition': 'sit' }
                    ]
                },
                {
                    'setType': 'wa',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'sit' },
                        { 'number': 1, 'assetPartDefinition': 'sit' },
                        { 'number': 2, 'assetPartDefinition': 'sit' },
                        { 'number': 3, 'assetPartDefinition': 'sit' },
                        { 'number': 4, 'assetPartDefinition': 'sit' },
                        { 'number': 5, 'assetPartDefinition': 'sit' },
                        { 'number': 6, 'assetPartDefinition': 'sit' },
                        { 'number': 7, 'assetPartDefinition': 'sit' }
                    ]
                },
                {
                    'setType': 'pt',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'sit' },
                        { 'number': 1, 'assetPartDefinition': 'sit' },
                        { 'number': 2, 'assetPartDefinition': 'sit' },
                        { 'number': 3, 'assetPartDefinition': 'sit' },
                        { 'number': 4, 'assetPartDefinition': 'sit' },
                        { 'number': 5, 'assetPartDefinition': 'sit' },
                        { 'number': 6, 'assetPartDefinition': 'sit' },
                        { 'number': 7, 'assetPartDefinition': 'sit' }
                    ]
                },
                {
                    'setType': 'ptr',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'sit' },
                        { 'number': 1, 'assetPartDefinition': 'sit' },
                        { 'number': 2, 'assetPartDefinition': 'sit' },
                        { 'number': 3, 'assetPartDefinition': 'sit' },
                        { 'number': 4, 'assetPartDefinition': 'sit' },
                        { 'number': 5, 'assetPartDefinition': 'sit' },
                        { 'number': 6, 'assetPartDefinition': 'sit' },
                        { 'number': 7, 'assetPartDefinition': 'sit' }
                    ]
                },
                {
                    'setType': 'ptl',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'sit' },
                        { 'number': 1, 'assetPartDefinition': 'sit' },
                        { 'number': 2, 'assetPartDefinition': 'sit' },
                        { 'number': 3, 'assetPartDefinition': 'sit' },
                        { 'number': 4, 'assetPartDefinition': 'sit' },
                        { 'number': 5, 'assetPartDefinition': 'sit' },
                        { 'number': 6, 'assetPartDefinition': 'sit' },
                        { 'number': 7, 'assetPartDefinition': 'sit' }
                    ]
                }
            ]
        },
        {
            'id': 'Lay',
            'parts': [
                {
                    'setType': 'ch',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'lay' },
                        { 'number': 1, 'assetPartDefinition': 'lay' },
                        { 'number': 2, 'assetPartDefinition': 'lay' },
                        { 'number': 3, 'assetPartDefinition': 'lay' },
                        { 'number': 4, 'assetPartDefinition': 'lay' },
                        { 'number': 5, 'assetPartDefinition': 'lay' },
                        { 'number': 6, 'assetPartDefinition': 'lay' },
                        { 'number': 7, 'assetPartDefinition': 'lay' }
                    ]
                },
                {
                    'setType': 'cc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'lay' },
                        { 'number': 1, 'assetPartDefinition': 'lay' },
                        { 'number': 2, 'assetPartDefinition': 'lay' },
                        { 'number': 3, 'assetPartDefinition': 'lay' },
                        { 'number': 4, 'assetPartDefinition': 'lay' },
                        { 'number': 5, 'assetPartDefinition': 'lay' },
                        { 'number': 6, 'assetPartDefinition': 'lay' },
                        { 'number': 7, 'assetPartDefinition': 'lay' }
                    ]
                },
                {
                    'setType': 'mc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'lay' },
                        { 'number': 1, 'assetPartDefinition': 'lay' },
                        { 'number': 2, 'assetPartDefinition': 'lay' },
                        { 'number': 3, 'assetPartDefinition': 'lay' },
                        { 'number': 4, 'assetPartDefinition': 'lay' },
                        { 'number': 5, 'assetPartDefinition': 'lay' },
                        { 'number': 6, 'assetPartDefinition': 'lay' },
                        { 'number': 7, 'assetPartDefinition': 'lay' }
                    ]
                },
                {
                    'setType': 'mco',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'lay' },
                        { 'number': 1, 'assetPartDefinition': 'lay' },
                        { 'number': 2, 'assetPartDefinition': 'lay' },
                        { 'number': 3, 'assetPartDefinition': 'lay' },
                        { 'number': 4, 'assetPartDefinition': 'lay' },
                        { 'number': 5, 'assetPartDefinition': 'lay' },
                        { 'number': 6, 'assetPartDefinition': 'lay' },
                        { 'number': 7, 'assetPartDefinition': 'lay' }
                    ]
                },
                {
                    'setType': 'mcu',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'lay' },
                        { 'number': 1, 'assetPartDefinition': 'lay' },
                        { 'number': 2, 'assetPartDefinition': 'lay' },
                        { 'number': 3, 'assetPartDefinition': 'lay' },
                        { 'number': 4, 'assetPartDefinition': 'lay' },
                        { 'number': 5, 'assetPartDefinition': 'lay' },
                        { 'number': 6, 'assetPartDefinition': 'lay' },
                        { 'number': 7, 'assetPartDefinition': 'lay' }
                    ]
                },
                {
                    'setType': 'ls',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'lay' },
                        { 'number': 1, 'assetPartDefinition': 'lay' },
                        { 'number': 2, 'assetPartDefinition': 'lay' },
                        { 'number': 3, 'assetPartDefinition': 'lay' },
                        { 'number': 4, 'assetPartDefinition': 'lay' },
                        { 'number': 5, 'assetPartDefinition': 'lay' },
                        { 'number': 6, 'assetPartDefinition': 'lay' },
                        { 'number': 7, 'assetPartDefinition': 'lay' }
                    ]
                },
                {
                    'setType': 'lc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'lay' },
                        { 'number': 1, 'assetPartDefinition': 'lay' },
                        { 'number': 2, 'assetPartDefinition': 'lay' },
                        { 'number': 3, 'assetPartDefinition': 'lay' },
                        { 'number': 4, 'assetPartDefinition': 'lay' },
                        { 'number': 5, 'assetPartDefinition': 'lay' },
                        { 'number': 6, 'assetPartDefinition': 'lay' },
                        { 'number': 7, 'assetPartDefinition': 'lay' }
                    ]
                },
                {
                    'setType': 'mcl',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'lay' },
                        { 'number': 1, 'assetPartDefinition': 'lay' },
                        { 'number': 2, 'assetPartDefinition': 'lay' },
                        { 'number': 3, 'assetPartDefinition': 'lay' },
                        { 'number': 4, 'assetPartDefinition': 'lay' },
                        { 'number': 5, 'assetPartDefinition': 'lay' },
                        { 'number': 6, 'assetPartDefinition': 'lay' },
                        { 'number': 7, 'assetPartDefinition': 'lay' }
                    ]
                },
                {
                    'setType': 'rs',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'lay' },
                        { 'number': 1, 'assetPartDefinition': 'lay' },
                        { 'number': 2, 'assetPartDefinition': 'lay' },
                        { 'number': 3, 'assetPartDefinition': 'lay' },
                        { 'number': 4, 'assetPartDefinition': 'lay' },
                        { 'number': 5, 'assetPartDefinition': 'lay' },
                        { 'number': 6, 'assetPartDefinition': 'lay' },
                        { 'number': 7, 'assetPartDefinition': 'lay' }
                    ]
                },
                {
                    'setType': 'rc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'lay' },
                        { 'number': 1, 'assetPartDefinition': 'lay' },
                        { 'number': 2, 'assetPartDefinition': 'lay' },
                        { 'number': 3, 'assetPartDefinition': 'lay' },
                        { 'number': 4, 'assetPartDefinition': 'lay' },
                        { 'number': 5, 'assetPartDefinition': 'lay' },
                        { 'number': 6, 'assetPartDefinition': 'lay' },
                        { 'number': 7, 'assetPartDefinition': 'lay' }
                    ]
                },
                {
                    'setType': 'mcr',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'lay' },
                        { 'number': 1, 'assetPartDefinition': 'lay' },
                        { 'number': 2, 'assetPartDefinition': 'lay' },
                        { 'number': 3, 'assetPartDefinition': 'lay' },
                        { 'number': 4, 'assetPartDefinition': 'lay' },
                        { 'number': 5, 'assetPartDefinition': 'lay' },
                        { 'number': 6, 'assetPartDefinition': 'lay' },
                        { 'number': 7, 'assetPartDefinition': 'lay' }
                    ]
                },
                {
                    'setType': 'ha',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'lay' },
                        { 'number': 1, 'assetPartDefinition': 'lay' },
                        { 'number': 2, 'assetPartDefinition': 'lay' },
                        { 'number': 3, 'assetPartDefinition': 'lay' },
                        { 'number': 4, 'assetPartDefinition': 'lay' },
                        { 'number': 5, 'assetPartDefinition': 'lay' },
                        { 'number': 6, 'assetPartDefinition': 'lay' },
                        { 'number': 7, 'assetPartDefinition': 'lay' }
                    ]
                },
                {
                    'setType': 'he',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'lay' },
                        { 'number': 1, 'assetPartDefinition': 'lay' },
                        { 'number': 2, 'assetPartDefinition': 'lay' },
                        { 'number': 3, 'assetPartDefinition': 'lay' },
                        { 'number': 4, 'assetPartDefinition': 'lay' },
                        { 'number': 5, 'assetPartDefinition': 'lay' },
                        { 'number': 6, 'assetPartDefinition': 'lay' },
                        { 'number': 7, 'assetPartDefinition': 'lay' }
                    ]
                },
                {
                    'setType': 'wa',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'lay' },
                        { 'number': 1, 'assetPartDefinition': 'lay' },
                        { 'number': 2, 'assetPartDefinition': 'lay' },
                        { 'number': 3, 'assetPartDefinition': 'lay' },
                        { 'number': 4, 'assetPartDefinition': 'lay' },
                        { 'number': 5, 'assetPartDefinition': 'lay' },
                        { 'number': 6, 'assetPartDefinition': 'lay' },
                        { 'number': 7, 'assetPartDefinition': 'lay' }
                    ]
                },
                {
                    'setType': 'pt',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'lay' },
                        { 'number': 1, 'assetPartDefinition': 'lay' },
                        { 'number': 2, 'assetPartDefinition': 'lay' },
                        { 'number': 3, 'assetPartDefinition': 'lay' },
                        { 'number': 4, 'assetPartDefinition': 'lay' },
                        { 'number': 5, 'assetPartDefinition': 'lay' },
                        { 'number': 6, 'assetPartDefinition': 'lay' },
                        { 'number': 7, 'assetPartDefinition': 'lay' }
                    ]
                },
                {
                    'setType': 'ptr',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'lay' },
                        { 'number': 1, 'assetPartDefinition': 'lay' },
                        { 'number': 2, 'assetPartDefinition': 'lay' },
                        { 'number': 3, 'assetPartDefinition': 'lay' },
                        { 'number': 4, 'assetPartDefinition': 'lay' },
                        { 'number': 5, 'assetPartDefinition': 'lay' },
                        { 'number': 6, 'assetPartDefinition': 'lay' },
                        { 'number': 7, 'assetPartDefinition': 'lay' }
                    ]
                },
                {
                    'setType': 'ptl',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'lay' },
                        { 'number': 1, 'assetPartDefinition': 'lay' },
                        { 'number': 2, 'assetPartDefinition': 'lay' },
                        { 'number': 3, 'assetPartDefinition': 'lay' },
                        { 'number': 4, 'assetPartDefinition': 'lay' },
                        { 'number': 5, 'assetPartDefinition': 'lay' },
                        { 'number': 6, 'assetPartDefinition': 'lay' },
                        { 'number': 7, 'assetPartDefinition': 'lay' }
                    ]
                }
            ]
        },
        {
            'id': 'Move',
            'parts': [
                {
                    'setType': 'bd',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'bds',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'ss',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'lg',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'sh',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'lh',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'lhs',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'ls',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'lc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'mcl',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'rh',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'rhs',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'rs',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'rc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'mcr',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'ch',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'cc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'ha',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'he',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'ca',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'wa',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'hr',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'hrb',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'ea',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'fa',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'pt',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'ptr',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'ptl',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'mc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'mco',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                },
                {
                    'setType': 'mcu',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wlk' },
                        { 'number': 1, 'assetPartDefinition': 'wlk' },
                        { 'number': 2, 'assetPartDefinition': 'wlk' },
                        { 'number': 3, 'assetPartDefinition': 'wlk' }
                    ]
                }
            ]
        },
        {
            'id': 'Wave',
            'parts': [
                {
                    'setType': 'lh',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wav' },
                        { 'number': 1, 'assetPartDefinition': 'wav' }
                    ]
                },
                {
                    'setType': 'lhs',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wav' },
                        { 'number': 1, 'assetPartDefinition': 'wav' }
                    ]
                },
                {
                    'setType': 'ls',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wav' },
                        { 'number': 1, 'assetPartDefinition': 'wav' }
                    ]
                },
                {
                    'setType': 'lc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wav' },
                        { 'number': 1, 'assetPartDefinition': 'wav' }
                    ]
                },
                {
                    'setType': 'mcl',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wav' },
                        { 'number': 1, 'assetPartDefinition': 'wav' }
                    ]
                },
                {
                    'setType': 'ch',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wav' },
                        { 'number': 1, 'assetPartDefinition': 'wav' },
                        { 'number': 2, 'assetPartDefinition': 'wav' },
                        { 'number': 3, 'assetPartDefinition': 'wav' }
                    ]
                },
                {
                    'setType': 'pt',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wav' },
                        { 'number': 1, 'assetPartDefinition': 'wav' }
                    ]
                },
                {
                    'setType': 'ptr',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wav' },
                        { 'number': 1, 'assetPartDefinition': 'wav' }
                    ]
                },
                {
                    'setType': 'ptl',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wav' },
                        { 'number': 1, 'assetPartDefinition': 'wav' }
                    ]
                },
                {
                    'setType': 'mc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wav' },
                        { 'number': 1, 'assetPartDefinition': 'wav' }
                    ]
                }
            ]
        },
        {
            'id': 'Talk',
            'parts': [
                {
                    'setType': 'hd',
                    'frames': [
                        {
                            'number': 0,
                            'assetPartDefinition': 'spk'
                        },
                        {
                            'number': 1,
                            'assetPartDefinition': 'spk'
                        }
                    ]
                },
                {
                    'setType': 'fc',
                    'frames': [
                        {
                            'number': 0,
                            'assetPartDefinition': 'spk'
                        },
                        {
                            'number': 1,
                            'assetPartDefinition': 'spk'
                        }
                    ]
                },
                {
                    'setType': 'fa',
                    'frames': [
                        {
                            'number': 0,
                            'assetPartDefinition': 'spk'
                        },
                        {
                            'number': 1,
                            'assetPartDefinition': 'spk'
                        }
                    ]
                }
            ]
        },
        {
            'id': 'Sign',
            'parts': [
                {
                    'setType': 'lh',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'sig' }
                    ]
                },
                {
                    'setType': 'li',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'sig' }
                    ]
                },
                {
                    'setType': 'ls',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wav' }
                    ]
                },
                {
                    'setType': 'lc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wav' }
                    ]
                },
                {
                    'setType': 'mcl',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wav' }
                    ]
                }
            ]
        },
        {
            'id': 'Respect',
            'parts': [
                {
                    'setType': 'lh',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'respect', 'repeats': 15 },
                        { 'number': 1, 'assetPartDefinition': 'respect', 'repeats': 15 }
                    ]
                },
                {
                    'setType': 'ls',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wav', 'repeats': 15 },
                        { 'number': 1, 'assetPartDefinition': 'wav', 'repeats': 15 }
                    ]
                },
                {
                    'setType': 'lc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wav', 'repeats': 15 },
                        { 'number': 1, 'assetPartDefinition': 'wav', 'repeats': 15 }
                    ]
                },
                {
                    'setType': 'mcl',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'wav', 'repeats': 15 },
                        { 'number': 1, 'assetPartDefinition': 'wav', 'repeats': 15 }
                    ]
                }
            ]
        },
        {
            'id': 'Blow',
            'parts': [
                {
                    'setType': 'rh',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'blw', 'repeats': 10 },
                        { 'number': 1, 'assetPartDefinition': 'blw', 'repeats': 10 }
                    ]
                },
                {
                    'setType': 'rs',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'drk' }
                    ]
                },
                {
                    'setType': 'rc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'drk' }
                    ]
                },
                {
                    'setType': 'mcr',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'drk' }
                    ]
                },
                {
                    'setType': 'ri',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': '' }
                    ]
                },
                {
                    'setType': 'ey',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std', 'repeats': 10 },
                        { 'number': 0, 'assetPartDefinition': 'eyb', 'repeats': 10 }
                    ]
                },
                {
                    'setType': 'fc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std', 'repeats': 10 },
                        { 'number': 0, 'assetPartDefinition': 'blw', 'repeats': 10 }
                    ]
                }
            ]
        },
        {
            'id': 'Laugh',
            'parts': [
                {
                    'setType': 'rh',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'blw' }
                    ]
                },
                {
                    'setType': 'rs',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'drk' }
                    ]
                },
                {
                    'setType': 'rc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'drk' }
                    ]
                },
                {
                    'setType': 'mcr',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'drk' }
                    ]
                },
                {
                    'setType': 'ri',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': '' }
                    ]
                },
                {
                    'setType': 'ey',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std', 'repeats': 2 }
                    ]
                },
                {
                    'setType': 'fc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'sml' }
                    ]
                }
            ],
            'offsets': {
                'frames': [
                    {
                        'id': 0,
                        'directions': [
                            {
                                'id': 0,
                                'bodyParts': [
                                    {
                                        'id': 'head',
                                        'dx': 0,
                                        'dy': 1
                                    }
                                ]
                            },
                            {
                                'id': 1,
                                'bodyParts': [
                                    {
                                        'id': 'head',
                                        'dx': 0,
                                        'dy': 1
                                    }
                                ]
                            },
                            {
                                'id': 2,
                                'bodyParts': [
                                    {
                                        'id': 'head',
                                        'dx': 0,
                                        'dy': 1
                                    }
                                ]
                            },
                            {
                                'id': 3,
                                'bodyParts': [
                                    {
                                        'id': 'head',
                                        'dx': 0,
                                        'dy': 1
                                    }
                                ]
                            },
                            {
                                'id': 4,
                                'bodyParts': [
                                    {
                                        'id': 'head',
                                        'dx': 0,
                                        'dy': 1
                                    }
                                ]
                            },
                            {
                                'id': 5,
                                'bodyParts': [
                                    {
                                        'id': 'head',
                                        'dx': 0,
                                        'dy': 1
                                    }
                                ]
                            },
                            {
                                'id': 6,
                                'bodyParts': [
                                    {
                                        'id': 'head',
                                        'dx': 0,
                                        'dy': 1
                                    }
                                ]
                            },
                            {
                                'id': 7,
                                'bodyParts': [
                                    {
                                        'id': 'head',
                                        'dx': 0,
                                        'dy': 1
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        'id': 1,
                        'directions': [
                            {
                                'id': 0,
                                'bodyParts': [
                                    {
                                        'id': 'head',
                                        'dx': 0,
                                        'dy': 0
                                    }
                                ]
                            },
                            {
                                'id': 1,
                                'bodyParts': [
                                    {
                                        'id': 'head',
                                        'dx': 0,
                                        'dy': 0
                                    }
                                ]
                            },
                            {
                                'id': 2,
                                'bodyParts': [
                                    {
                                        'id': 'head',
                                        'dx': 0,
                                        'dy': 0
                                    }
                                ]
                            },
                            {
                                'id': 3,
                                'bodyParts': [
                                    {
                                        'id': 'head',
                                        'dx': 0,
                                        'dy': 0
                                    }
                                ]
                            },
                            {
                                'id': 4,
                                'bodyParts': [
                                    {
                                        'id': 'head',
                                        'dx': 0,
                                        'dy': 0
                                    }
                                ]
                            },
                            {
                                'id': 5,
                                'bodyParts': [
                                    {
                                        'id': 'head',
                                        'dx': 0,
                                        'dy': 0
                                    }
                                ]
                            },
                            {
                                'id': 6,
                                'bodyParts': [
                                    {
                                        'id': 'head',
                                        'dx': 0,
                                        'dy': 0
                                    }
                                ]
                            },
                            {
                                'id': 7,
                                'bodyParts': [
                                    {
                                        'id': 'head',
                                        'dx': 0,
                                        'dy': 0
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        },
        {
            'id': 'Swim',
            'parts': [
                {
                    'setType': 'bds',
                    'frames': [
                        {
                            'number': 0,
                            'assetPartDefinition': 'swm'
                        },
                        {
                            'number': 1,
                            'assetPartDefinition': 'swm'
                        },
                        {
                            'number': 2,
                            'assetPartDefinition': 'swm'
                        },
                        {
                            'number': 3,
                            'assetPartDefinition': 'swm'
                        }
                    ]
                },
                {
                    'setType': 'ss',
                    'frames': [
                        {
                            'number': 0,
                            'assetPartDefinition': 'swm'
                        },
                        {
                            'number': 1,
                            'assetPartDefinition': 'swm'
                        },
                        {
                            'number': 2,
                            'assetPartDefinition': 'swm'
                        },
                        {
                            'number': 3,
                            'assetPartDefinition': 'swm'
                        }
                    ]
                },
                {
                    'setType': 'lhs',
                    'frames': [
                        {
                            'number': 0,
                            'assetPartDefinition': 'swm'
                        },
                        {
                            'number': 1,
                            'assetPartDefinition': 'swm'
                        },
                        {
                            'number': 2,
                            'assetPartDefinition': 'swm'
                        },
                        {
                            'number': 3,
                            'assetPartDefinition': 'swm'
                        }
                    ]
                },
                {
                    'setType': 'rhs',
                    'frames': [
                        {
                            'number': 0,
                            'assetPartDefinition': 'swm'
                        },
                        {
                            'number': 1,
                            'assetPartDefinition': 'swm'
                        },
                        {
                            'number': 2,
                            'assetPartDefinition': 'swm'
                        },
                        {
                            'number': 3,
                            'assetPartDefinition': 'swm'
                        }
                    ]
                },
            ]
        },
        {
            'id': 'Float',
            'parts': [
                {
                    'setType': 'bds',
                    'frames': [
                        {
                            'number': 3,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 3,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 2,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 1,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 0,
                            'assetPartDefinition': 'sws'
                        }
                    ]
                },
                {
                    'setType': 'ss',
                    'frames': [
                        {
                            'number': 0,
                            'assetPartDefinition': 'sws'
                        }
                    ]
                },
                {
                    'setType': 'lhs',
                    'frames': [
                        {
                            'number': 0,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 0,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 1,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 1,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 2,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 3,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 3,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 2,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 1,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 1,
                            'assetPartDefinition': 'sws'
                        }
                    ]
                },
                {
                    'setType': 'rhs',
                    'frames': [
                        {
                            'number': 0,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 0,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 1,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 1,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 2,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 3,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 3,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 2,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 1,
                            'assetPartDefinition': 'sws'
                        },
                        {
                            'number': 1,
                            'assetPartDefinition': 'sws'
                        }
                    ]
                },
            ]
        },
        {
            'id': 'SnowWarRun',
            'parts': [{
                'setType': 'ch',
                'frames': [3, 2, 1, 0].map(number => ({ 'number': number, 'assetPartDefinition': 'swrun' }))
            }]
        },
        {
            'id': 'SnowWarDieFront',
            'parts': [{
                'setType': 'ch',
                'frames': [
                    { 'number': 0, 'assetPartDefinition': 'swdie' },
                    { 'number': 0, 'assetPartDefinition': 'swdie' },
                    { 'number': 1, 'assetPartDefinition': 'swdie' },
                    { 'number': 1, 'assetPartDefinition': 'swdie', 'repeats': 100 }
                ]
            }],
            'offsets': { 'frames': snowWarHeadOffsets(true) }
        },
        {
            'id': 'SnowWarDieBack',
            'parts': [{
                'setType': 'ch',
                'frames': [
                    { 'number': 2, 'assetPartDefinition': 'swdie' },
                    { 'number': 2, 'assetPartDefinition': 'swdie' },
                    { 'number': 3, 'assetPartDefinition': 'swdie' },
                    { 'number': 3, 'assetPartDefinition': 'swdie', 'repeats': 100 }
                ]
            }],
            'offsets': { 'frames': snowWarHeadOffsets(false) }
        },
        {
            'id': 'SnowWarPick',
            'parts': [{
                'setType': 'ch',
                'frames': [{ 'number': 0, 'assetPartDefinition': 'swpick' }]
            }],
            'offsets': {
                'frames': [{
                    'id': 0,
                    'directions': [0, 1, 2, 3, 4, 5, 6, 7].map(direction => ({
                        'id': direction,
                        'bodyParts': [{ 'id': 'head', 'dx': 0, 'dy': 3 }]
                    }))
                }]
            }
        },
        {
            'id': 'SnowWarThrow',
            'parts': [{
                'setType': 'ch',
                'frames': [
                    { 'number': 0, 'assetPartDefinition': 'swthrow', 'repeats': 2 },
                    { 'number': 1, 'assetPartDefinition': 'swthrow', 'repeats': 6 },
                    { 'number': 0, 'assetPartDefinition': 'swthrow', 'repeats': 100 }
                ]
            }]
        },
        {
            'id': 'Sleep',
            'parts': [
                {
                    'setType': 'ch',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'cc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'mc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'ls',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'lc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'mcl',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'rs',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'rc',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'mcr',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'ha',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'he',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'wa',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'pt',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'ptr',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                },
                {
                    'setType': 'ptl',
                    'frames': [
                        { 'number': 0, 'assetPartDefinition': 'std' },
                        { 'number': 1, 'assetPartDefinition': 'std' },
                        { 'number': 2, 'assetPartDefinition': 'std' },
                        { 'number': 3, 'assetPartDefinition': 'std' },
                        { 'number': 4, 'assetPartDefinition': 'std' },
                        { 'number': 5, 'assetPartDefinition': 'std' },
                        { 'number': 6, 'assetPartDefinition': 'std' },
                        { 'number': 7, 'assetPartDefinition': 'std' }
                    ]
                }
            ]
        }
    ]
};
