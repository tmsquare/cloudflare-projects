# Makefile

R2_DIR = r2-demo

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

	@echo "########## R2 OPERATIONS ###########"
	@echo "make create_bucket <NAME>"
	@echo "make delete_bucket <NAME>"
	@echo "make list_buckets"
	@echo "make get_object <BUCKET> <KEY> <LOCAL_PATH>"
	@echo "make put_object <BUCKET> <KEY> <PATH_TO_FILE>"
	@echo "make delete_object <BUCKET> <KEY>"
	@echo "  "


####################################
########## WORKERS OPERATIONS ######
####################################
create_worker: 
	npm create cloudflare@latest $(word 2,$(MAKECMDGOALS))

login: 
	npx wrangler login

deploy: 
	cd $(R2_DIR) && npx wrangler deploy


####################################
########## R2 OPERATIONS ###########
####################################
create_bucket: 
	cd $(R2_DIR) && npx wrangler r2 bucket create $(word 2,$(MAKECMDGOALS))

delete_bucket:
	cd $(R2_DIR) && npx wrangler r2 bucket delete $(word 2,$(MAKECMDGOALS))

list_buckets:			
	cd $(R2_DIR) && npx wrangler r2 bucket list

get_object:	
	cd $(R2_DIR) && npx wrangler r2 object get $(word 2,$(MAKECMDGOALS))/$(word 3,$(MAKECMDGOALS)) --persist-to $(word 4,$(MAKECMDGOALS))

put_object:
	cd $(R2_DIR) && npx wrangler r2 object put $(word 2,$(MAKECMDGOALS))/$(word 3,$(MAKECMDGOALS)) --file $(word 4,$(MAKECMDGOALS))

delete_object:			
	cd $(R2_DIR) && npx wrangler r2 object delete $(word 2,$(MAKECMDGOALS))/$(word 3,$(MAKECMDGOALS)) 

