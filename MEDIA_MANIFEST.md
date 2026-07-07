# Media Manifest — Barriando Landing

All media slots use the `MediaSlot` component. Upload files to `public/` at the paths below.
If a file is missing, a styled placeholder is shown at build/runtime without breaking the site.

## Hero

| Slot ID | Type | Path | Aspect | Description |
|---------|------|------|--------|-------------|
| `hero-background` | video | `/videos/hero-barriando.mp4` | 16/9 (full bleed) | Looping hero background for home landing |

## MAP Anchor Section

| Slot ID | Type | Path | Aspect | Description |
|---------|------|------|--------|-------------|
| `map-bloque-hoy` | image | `/map/bloque-hoy.jpg` | 4/3 | Circuito actual MAP — ruta peatonal, pasaporte, GPS, sellos QR |
| `map-bloque-desarrollo` | image | `/map/bloque-desarrollo.jpg` | 4/3 | Visión Corredor de Oficios Vivos — Barrios Fundacionales |

## Equipo (8 members)

| Slot ID | Type | Path | Description |
|---------|------|------|-------------|
| `equipo-alexander-gehrke` | image | `/equipo/alexander-gehrke.jpg` | Alexander Gehrke — Presidente |
| `equipo-luis-vazquez-mota` | image | `/equipo/luis-vazquez-mota.jpg` | Luis Vázquez Mota — Vicepresidente |
| `equipo-juan-jose-cue` | image | `/equipo/juan-jose-cue.jpg` | Juan José Cué — Secretario |
| `equipo-jose-ramon-lozano` | image | `/equipo/jose-ramon-lozano.jpg` | José Ramón Lozano — Tesorero |
| `equipo-georgina-vigueras` | image | `/equipo/georgina-vigueras.jpg` | Georgina Vigueras — Directora General |
| `equipo-alan-bermudez` | image | `/equipo/alan-bermudez.jpg` | Alan Bermúdez — Director de Comunicación |
| `equipo-abril-cantu` | image | `/equipo/abril-cantu.jpg` | Abril Cantú — Digital Content Manager |
| `equipo-guilebaldo-ruiz` | image | `/equipo/guilebaldo-ruiz.jpg` | Guilebaldo Ruiz — Director de Tecnología |

## Testimonials (optional, via admin)

Testimonial photos are stored as `photoUrl` in the database (admin-managed), not as MediaSlots.

## Upload checklist

```bash
public/videos/hero-barriando.mp4
public/map/bloque-hoy.jpg
public/map/bloque-desarrollo.jpg
public/equipo/alexander-gehrke.jpg
public/equipo/luis-vazquez-mota.jpg
public/equipo/juan-jose-cue.jpg
public/equipo/jose-ramon-lozano.jpg
public/equipo/georgina-vigueras.jpg
public/equipo/alan-bermudez.jpg
public/equipo/abril-cantu.jpg
public/equipo/guilebaldo-ruiz.jpg
```
