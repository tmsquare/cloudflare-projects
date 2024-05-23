# Makefile

KV_DIR = kv-demo

.PHONY: all
all:
	@echo "Please define a specific target" 

help:
	@echo "########## Workers OPERATIONS ###########"
	@echo "make create_worker <NAMESPACE>"
	@echo "make deploy"
	@echo " "
	@echo " "

	@echo "########## KV OPERATIONS ###########"
	@echo "make create_namespace <NAMESPACE>"
	@echo "make delete_namespace <NAMESPACE_ID>"
	@echo "make list_namespaces"
	@echo "make get_key <KEY> <NAMESPACE_ID>"
	@echo "make put_key <KEY> <VALUE> <NAMESPACE_ID>"
	@echo "make delete_key <KEY> <NAMESPACE_ID>" 
	@echo "make list_keys <NAMESPACE_ID>" 


####################################
########## WORKERS OPERATIONS ######
####################################
create_worker: 
	npm create cloudflare@latest $(word 2,$(MAKECMDGOALS))

deploy: 
	cd $(KV_DIR) && npx wrangler deploy


####################################
########## KV OPERATIONS ###########
####################################
create_namespace:
	cd $(KV_DIR) && npx wrangler kv:namespace create $(word 2,$(MAKECMDGOALS))

delete_namespace:
	cd $(KV_DIR) && npx wrangler kv:namespace delete --namespace-id=$(word 2,$(MAKECMDGOALS))

list_namespaces:
	cd $(KV_DIR) && npx wrangler kv:namespace list

get_key: 
	cd $(KV_DIR) && npx wrangler kv:key get $(word 2,$(MAKECMDGOALS)) --namespace-id=$(word 3,$(MAKECMDGOALS)) 

put_key: 
	cd $(KV_DIR) && npx wrangler kv:key put $(word 2,$(MAKECMDGOALS)) $(word 3,$(MAKECMDGOALS)) --namespace-id=$(word 4,$(MAKECMDGOALS)) 

delete_key:
	cd $(KV_DIR) && npx wrangler kv:key delete $(word 2,$(MAKECMDGOALS)) --namespace-id=$(word 3,$(MAKECMDGOALS)) 

list_keys: 
	cd $(KV_DIR) && npx wrangler kv:key list --namespace-id=$(word 2,$(MAKECMDGOALS)) 