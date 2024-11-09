# Makefile

D1_DIR = d1-demo

.PHONY: all
all:
	@echo "Please define a specific target" 

help:
	@echo "########## Workers OPERATIONS ###########"
	@echo "make create_worker <NAMESPACE>"
	@echo "make deploy"
	@echo "make login"
	@echo " "
	@echo " "

	@echo "########## D1 OPERATIONS ###########"
	@echo "make create_database <DATABASE_NAME>"
	@echo "make list_databases" 
	@echo "make delete_database <DATABASE_NAME>" 
	@echo "make exucute_query <DATABASE_NAME> <PATH_TO_SQL_COMMANDS_FILE>" 
	@echo "  "


####################################
########## WORKERS OPERATIONS ######
####################################
create_worker: 
	npm create cloudflare@latest $(word 2,$(MAKECMDGOALS))

login: 
	npx wrangler login

deploy: 
	cd $(D1_DIR) && npx wrangler deploy


####################################
########## D1 OPERATIONS ###########
####################################
create_database:
	cd $(D1_DIR) && npx wrangler d1 create $(word 2,$(MAKECMDGOALS))

list_databases:
	cd $(D1_DIR) && npx wrangler d1 list

delete_database:
	cd $(D1_DIR) && npx wrangler d1 delete $(word 2,$(MAKECMDGOALS))

exucute_query:
	cd $(D1_DIR) && npx wrangler d1 execute $(word 2,$(MAKECMDGOALS)) --file=$(word 3,$(MAKECMDGOALS))

