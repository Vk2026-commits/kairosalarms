<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Render the quote diagnostic directly in the opening section and track QuoteStarted on the first answer, so visitors enter the existing frontend-only flow without a start-button gate.
- Meta Pixel lives only in src/lib/meta-pixel.ts: PageView from the root route per URL, Lead only after a confirmed lead save, deduped by submission id; never send personal data to Meta.
- Meta Pixel's shared consent guard requires a production build and the exact production hostname, so all event entry points reject previews and development.
- Results-screen call actions use the shared business-phone constant to prevent placeholder numbers diverging between actions.
