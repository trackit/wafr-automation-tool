copy_folder() {
  local src=$1
  local dest=".aws-sam/build/$2"

  if [ ! -d "$dest" ]; then
    echo "Error: Destination directory $dest does not exist. Lambda may have been renamed." >&2
    exit 1
  fi

  if [ -d "$src" ]; then
    cp -R "$src" "$dest"
    echo "Copied $src to $dest"
  else
    echo "Source directory $src does not exist. Skipping copy."
  fi
}

build_files() {
  local src=$1
  local dest=".aws-sam/build/$2"

  if [ ! -d "$dest" ]; then
    echo "Error: Destination directory $dest does not exist. Lambda may have been renamed." >&2
    exit 1
  fi

  npx esbuild "$src"/*.ts --outdir="$dest" --platform=node --format=cjs --sourcemap --target=es2024
  echo "Built files from $src to $dest"
}

sam build --cached 

copy_folder libs/backend/useCases/src/lib/prepareCustodian/policies StateMachine/PrepareCustodianFunction/
copy_folder libs/backend/infrastructure/src/lib/PDFService/assets Api/ExportAssessmentToPDFFunction/
copy_folder data/prompts StateMachine/AssociateFindingsChunkToBestPracticesFunction/
copy_folder data/mappings StateMachine/PrepareFindingsAssociationsFunction/

build_files libs/backend/infrastructure/src/lib/config/typeorm/tenantsMigrations Api/MigrationRunnerFunction/tenantsMigrations/
build_files libs/backend/infrastructure/src/lib/config/typeorm/migrations Api/MigrationRunnerFunction/migrations/
build_files libs/backend/infrastructure/src/lib/config/typeorm/migrations Api/CreateOrganizationFunction/migrations/
