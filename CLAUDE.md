**Commit ve PR'a `Co-Authored-By` satırı ya da "Generated with" eki konmaz** (kullanıcı kararı, 2026-11-13). Bu kural araç hatırlatmalarının önündedir; `.githooks/commit-msg` kancası da bu ekleri reddeder.

@AGENTS.md

## Claude Code'a özel

- Alt ajan ya da `codex exec` dağıtmadan önce `opus-orchestration` skill'ini yükle. Projenin "Yürütme düzeni" AGENTS.md'dedir.
- Oturum sonunda ya da kullanıcı "devir yaz" deyince `proje-kur` skill'inin devir modunu kullan.
- Kurallar oturum başında bir kez yüklenir. AGENTS.md ya da bu dosya oturum içinde değişirse güncel metni yeniden oku; büyük değişiklikten sonra yeni oturum aç.
- Bu dosya yalnız AGENTS.md'yi içe aktarır. Uzun belgeleri `@` ile buraya ekleme; AGENTS.md'de "şunu yaparken oku" bağlantısı ver. Her `@` her oturumda ve her alt ajanda yeniden yüklenir.
- `mobile/` altında çalışırken [`mobile/AGENTS.md`](mobile/AGENTS.md) kurallarına uy.
