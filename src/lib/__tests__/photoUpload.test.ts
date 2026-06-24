import {
  buildPhotoFilePart,
  isUploadUnavailable,
  uploadErrorMessage,
} from '../photoUpload';

describe('buildPhotoFilePart', () => {
  it('keeps a supported mime type and a valid file name', () => {
    const part = buildPhotoFilePart({ uri: 'file://a.png', mimeType: 'image/png', fileName: 'a.png' });
    expect(part).toEqual({ uri: 'file://a.png', name: 'a.png', type: 'image/png' });
  });

  it('falls back to image/jpeg + derived name for unknown/missing mime', () => {
    const part = buildPhotoFilePart({ uri: 'file://x', mimeType: 'image/heic' });
    expect(part.type).toBe('image/jpeg');
    expect(part.name).toBe('photo.jpg');
  });

  it('derives an extension from the mime when the file name has none', () => {
    const part = buildPhotoFilePart({ uri: 'file://x', mimeType: 'image/webp', fileName: 'noext' });
    expect(part.type).toBe('image/webp');
    expect(part.name).toBe('photo.webp');
  });
});

describe('isUploadUnavailable', () => {
  it('is true for the 501 avatar error code', () => {
    expect(isUploadUnavailable({ response: { status: 501, data: { error_code: 'AVATAR_UPLOAD_NOT_AVAILABLE' } } })).toBe(true);
  });

  it('is true for a 404 (feature flag off on alert photo)', () => {
    expect(isUploadUnavailable({ response: { status: 404 } })).toBe(true);
  });

  it('is false for a normal validation error', () => {
    expect(isUploadUnavailable({ response: { status: 400, data: { error_code: 'UPLOAD_INVALID_TYPE' } } })).toBe(false);
  });
});

describe('uploadErrorMessage', () => {
  it('maps known error codes to clear FR messages', () => {
    expect(uploadErrorMessage({ response: { data: { error_code: 'UPLOAD_INVALID_TYPE' } } })).toMatch(/Format/);
    expect(uploadErrorMessage({ response: { data: { error_code: 'UPLOAD_TOO_LARGE' } } })).toMatch(/volumineuse/);
    expect(uploadErrorMessage({ response: { data: { error_code: 'AVATAR_UPLOAD_NOT_AVAILABLE' } } })).toMatch(/pas encore disponible/);
  });

  it('has a safe default (never [object Object])', () => {
    const msg = uploadErrorMessage({});
    expect(typeof msg).toBe('string');
    expect(msg).not.toContain('object Object');
  });
});
