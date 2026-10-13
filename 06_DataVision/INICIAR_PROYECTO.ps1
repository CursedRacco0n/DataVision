# Ejecutar desde la carpeta en la que desean crear el proyecto.
ionic start datavision blank --type=angular --capacitor
Set-Location datavision
npm install axios echarts papaparse
npm install --save-dev @types/papaparse
npx cap add android
ionic serve
# Para Android, cuando compile: ionic build; npx cap sync android; npx cap open android
