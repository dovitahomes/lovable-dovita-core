-- Add auth hero image URL to corporate content
ALTER TABLE contenido_corporativo 
ADD COLUMN auth_hero_image_url TEXT;

-- Set default image from Unsplash
UPDATE contenido_corporativo 
SET auth_hero_image_url = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=2160&q=80'
WHERE auth_hero_image_url IS NULL;

COMMENT ON COLUMN contenido_corporativo.auth_hero_image_url IS 
'URL de la imagen de hero para la página de autenticación. Recomendado: 2160x1440px o mayor, formato landscape';