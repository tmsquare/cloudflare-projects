# Makefile

HD_DIR = hd-demo

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

	@echo "########## HYPERDRIVE OPERATIONS ###########"
	@echo "make create_hyperdrive_conn <NAME> <CONNECTION_STRING>"
	@echo "make list_hyperdrive_conns"
	@echo "make delete_hyperdrive_conn <ID>"
	@echo "make get_hyperdrive_conn <ID>" 


####################################
########## WORKERS OPERATIONS ######
####################################
create_worker: 
	npm create cloudflare@latest $(word 2,$(MAKECMDGOALS))

login: 
	npx wrangler login

deploy: 
	cd $(HD_DIR) && npx wrangler deploy


############################################
########## HYPERDRIVE OPERATIONS ###########
############################################
create_hyperdrive_conn:
	cd $(HD_DIR) && npx wrangler hyperdrive create $(word 2,$(MAKECMDGOALS)) --connection-string=$(word 3,$(MAKECMDGOALS))

list_hyperdrive_conns:
	cd $(HD_DIR) && npx wrangler hyperdrive list

delete_hyperdrive_conn:
	cd $(HD_DIR) && npx wrangler hyperdrive delete $(word 2,$(MAKECMDGOALS))

get_hyperdrive_conn:
	cd $(HD_DIR) && npx wrangler hyperdrive get $(word 2,$(MAKECMDGOALS))