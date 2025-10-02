sam build --cached 

cp -R libs/backend/useCases/src/lib/prepareCustodian/policies .aws-sam/build/StateMachine/PrepareCustodianFunction/
cp -R libs/backend/infrastructure/src/lib/PDFService/assets .aws-sam/build/Api/ExportAssessmentToPDFFunction/

esbuild libs/backend/infrastructure/src/lib/config/typeorm/migrations/*.ts --outdir=.aws-sam/build/Api/MigrationRunnerFunction/migrations --platform=node --format=cjs --sourcemap --target=es2020
esbuild libs/backend/infrastructure/src/lib/config/typeorm/tenantsMigrations/*.ts --outdir=.aws-sam/build/Api/MigrationRunnerFunction/tenantsMigrations --platform=node --format=cjs --sourcemap --target=es2020