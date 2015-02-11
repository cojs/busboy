BIN = ./node_modules/.bin/

test:
	@${BIN}mocha \
		--harmony \
		--reporter spec \
		--bail

.PHONY: test
