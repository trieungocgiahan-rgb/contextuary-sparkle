Use the uploaded image (IMG_8284.png) as the sign-in page background for the Contextuary auth flow. The image already contains its own clean lavender/purple gradient and 3D logo, so the existing decorative elements (floating SAT words, sparkles, orbital ring, pedestal glow, and the old 3D logo overlay) will be removed to avoid visual clutter.

### Implementation steps

1. **Asset upload**
   - Upload the attached `IMG_8284.png` to the Lovable Assets CDN.
   - Write the asset pointer to `src/assets/signin-bg.png.asset.json`.

2. **Auth page background (`src/routes/auth.tsx`)**
   - Replace the current animated radial-gradient backdrop and the left illustration panel with the new image.
   - Apply the image as a full-viewport background on the sign-in page, using `object-fit: cover` and `object-position: left center` so the 3D logo sits on the left while the empty right area naturally accommodates the auth card.
   - Add a very subtle, slow floating/breathing animation to the background image (small vertical drift) so it feels alive without adding random elements.
   - Remove the floating SAT words, sparkles, orbital dashed ring, pedestal glow, and the old `logo3d` image element.

3. **Keep auth logic and card intact**
   - Leave the Google sign-in button, session redirect, quotes carousel, and footer unchanged.
   - Ensure the card remains readable on top of the image on all viewports by keeping the card's semi-transparent backdrop blur and card background.

4. **Responsive check**
   - On mobile, the background should still cover the viewport and the card should sit over the lighter part of the gradient for contrast.

### Result
The sign-in page will have a clean, premium look with the new 3D logo illustration as the background, no extra decorations, and the existing Google auth card floating on the right.