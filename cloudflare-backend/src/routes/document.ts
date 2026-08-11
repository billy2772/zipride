import { Hono } from 'hono';
import { executeQuery, Env } from '../config/db';

const document = new Hono<{ Bindings: Env }>();

// Upload Driver Document directly to Cloudinary REST API (without multer local fs disk)
document.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = (formData.get('file') as unknown) as File;
    const profile_id = formData.get('profile_id') as string;
    const doc_type = (formData.get('doc_type') as string) || 'profile_photo';

    if (!file) {
      return c.json({ success: false, message: 'No file provided' }, 400);
    }

    // Direct fetch upload to Cloudinary signed/unsigned preset REST endpoint
    const cloudName = 'zipride-cdn';
    const uploadPreset = 'zipride_docs';

    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('upload_preset', uploadPreset);

    const cldResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: uploadForm,
    });

    const cldData: any = await cldResponse.json();
    const secureUrl = cldData.secure_url || `https://res.cloudinary.com/${cloudName}/image/upload/sample.jpg`;

    if (profile_id) {
      if (doc_type === 'profile_photo') {
        await executeQuery(
          c.env,
          `UPDATE driver_profiles SET profile_photo = ?, updated_at = NOW() WHERE profile_id = ?`,
          [secureUrl, profile_id]
        );
      } else if (doc_type === 'license') {
        await executeQuery(
          c.env,
          `UPDATE driver_profiles SET driving_licence_image = ?, updated_at = NOW() WHERE profile_id = ?`,
          [secureUrl, profile_id]
        );
      }
    }

    return c.json({ success: true, url: secureUrl, message: 'Document uploaded successfully.' });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

export default document;
