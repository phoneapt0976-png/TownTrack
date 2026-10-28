# TownTrack Figma update

This local Figma development plugin updates the existing TownTrack file
`IBE0iZdTBC1yTyVxHmwhvQ`.

It adds missing presentation frames, compacts the layout, and revises the
resource-request route through the five roles. The revised route is:

Citizen submission → intake assessment and supervisor assignment → supervisor
team assignment → field worker acceptance and resource request → supervisor
review and submission → intake review and forwarding → approver decision.

Affected screens are rebuilt as editable Figma layers. Unused action buttons
on those screens are removed. Mint is reserved for buttons linked to another
prototype screen. Running the plugin again does not add duplicate frames.

To apply it, import `manifest.json` as a development plugin in Figma Desktop,
open the TownTrack file, and run **TownTrack wireframe update**. Review the
resource route in Prototype mode: S02 → S03 → S04 → T02 → T03 → T04 →
W02 → W03 → W06 → W04 → T05 → S06 → A02 → A03 → A04. The two outcomes are
A05 (approved) and A06 (not approved).

This folder is source for the update. Its presence does not mean the remote
Figma file has already been changed.
