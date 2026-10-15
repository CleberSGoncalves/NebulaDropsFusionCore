@echo off
echo [*] Sincronizando backup no GitHub (Nebula Drops: Fusion Core)...
git add .
git commit -m "auto: deploy e build Nebula Drops: Fusion Core (CrazyGames HTML5)"
git push -u origin main
echo [OK] Backup concluido com sucesso!
