import { describe, expect, it } from 'vitest';
import { DEFAULT_FURNI_IMAGE_HOSTS, isAllowedFurniImageUrl, isAllowedUserImageUrl, isWebUrl, parseHostList } from './ExternalUrls';

const LOCATION = 'https://hotel.example/client/';

describe('isWebUrl', () =>
{
    it('accepts only absolute http(s) urls', () =>
    {
        expect(isWebUrl('https://example.com/x')).toBe(true);
        expect(isWebUrl('http://example.com')).toBe(true);
        expect(isWebUrl('javascript:alert(1)')).toBe(false);
        expect(isWebUrl('data:text/html,hi')).toBe(false);
        expect(isWebUrl('/relative')).toBe(false);
        expect(isWebUrl('')).toBe(false);
    });
});

describe('isAllowedUserImageUrl', () =>
{
    it('allows any web image when no hosts are configured', () =>
    {
        expect(isAllowedUserImageUrl('https://i.imgur.com/a.png', [], LOCATION)).toBe(true);
        expect(isAllowedUserImageUrl('/c_images/ads/a.png', [], LOCATION)).toBe(true);
    });

    it('refuses other schemes', () =>
    {
        expect(isAllowedUserImageUrl('local://room', [], LOCATION)).toBe(false);
        expect(isAllowedUserImageUrl('javascript:alert(1)', [], LOCATION)).toBe(false);
    });

    it('limits hosts when a list is configured', () =>
    {
        const hosts = parseHostList('imgur.com, hotel.example');

        expect(isAllowedUserImageUrl('https://i.imgur.com/a.png', hosts, LOCATION)).toBe(true);
        expect(isAllowedUserImageUrl('/c_images/a.png', hosts, LOCATION)).toBe(true);
        expect(isAllowedUserImageUrl('https://evilimgur.com/a.png', hosts, LOCATION)).toBe(false);
        expect(isAllowedUserImageUrl('https://tracker.example/a.png', hosts, LOCATION)).toBe(false);
    });
});

// Furni photos and video thumbnails took their URL from user data and loaded it from any host, showing the IP of
// everyone in the room to that host.
describe('isAllowedFurniImageUrl', () =>
{
    const PAGE = 'http://localhost:5173/client/';
    const CAMERA = ['http://localhost/camera/photo/temp'];

    it('allows this site and the sites the hotel configured, over any scheme', () =>
    {
        expect(isAllowedFurniImageUrl('/c_images/photo.png', DEFAULT_FURNI_IMAGE_HOSTS, CAMERA, PAGE)).toBe(true);
        expect(isAllowedFurniImageUrl('http://localhost/camera/photo/temp/1.png', DEFAULT_FURNI_IMAGE_HOSTS, CAMERA, PAGE)).toBe(true);
    });

    it('allows the listed hosts over https only', () =>
    {
        expect(isAllowedFurniImageUrl('https://img.youtube.com/vi/abc/0.jpg', DEFAULT_FURNI_IMAGE_HOSTS, CAMERA, PAGE)).toBe(true);
        expect(isAllowedFurniImageUrl('https://i.ytimg.com/vi/abc/0.jpg', DEFAULT_FURNI_IMAGE_HOSTS, CAMERA, PAGE)).toBe(true);
        expect(isAllowedFurniImageUrl('http://img.youtube.com/vi/abc/0.jpg', DEFAULT_FURNI_IMAGE_HOSTS, CAMERA, PAGE)).toBe(false);
    });

    it('refuses any other host and scheme', () =>
    {
        expect(isAllowedFurniImageUrl('https://tracker.example/pixel.png', DEFAULT_FURNI_IMAGE_HOSTS, CAMERA, PAGE)).toBe(false);
        expect(isAllowedFurniImageUrl('https://notyoutube.com/a.png', DEFAULT_FURNI_IMAGE_HOSTS, CAMERA, PAGE)).toBe(false);
        expect(isAllowedFurniImageUrl('http://localhost:8080/a.png', DEFAULT_FURNI_IMAGE_HOSTS, CAMERA, PAGE)).toBe(false);
        expect(isAllowedFurniImageUrl('data:image/png;base64,AAAA', DEFAULT_FURNI_IMAGE_HOSTS, CAMERA, PAGE)).toBe(false);
    });

    it('follows the configured list', () =>
    {
        expect(isAllowedFurniImageUrl('https://cdn.hotel.example/a.png', ['hotel.example'], [], PAGE)).toBe(true);
        expect(isAllowedFurniImageUrl('https://img.youtube.com/a.jpg', ['hotel.example'], [], PAGE)).toBe(false);
    });
});
