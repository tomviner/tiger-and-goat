tidy-imports:
	@autoflake --in-place --remove-all-unused-imports --ignore-init-module-imports --recursive server

black:
	@black server

isort:
	@isort server

format: black isort
	
