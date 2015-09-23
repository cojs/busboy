
test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--harmony \
		--reporter spec \
		--bail

test-cov:
	@NODE_ENV=test node --harmony node_modules/.bin/istanbul cover \
		-x test.js \
		node_modules/.bin/_mocha -- \
		--reporter spec \
		--bail

.PHONY: test
