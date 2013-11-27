BIN = ./node_modules/.bin/

test:
	@${BIN}mocha \
		--harmony-generators \
		--reporter spec \
		--bail

.PHONY: test