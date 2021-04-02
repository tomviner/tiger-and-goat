tidy-imports:
	@autoflake --in-place --remove-all-unused-imports --ignore-init-module-imports --recursive .

black:
	@black .

isort:
	@isort .

format: black isort
	
