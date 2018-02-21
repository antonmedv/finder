![finder](https://user-images.githubusercontent.com/141232/36463666-fb1acbde-16fd-11e8-84cd-c844456ff874.png)

# finder

[![Build Status](https://travis-ci.org/antonmedv/finder.svg?branch=master)](https://travis-ci.org/antonmedv/finder)

CSS Selector Generator

### Comparison with [optimal-select](https://github.com/Autarc/optimal-select)

`optimal-select` fails to generate selectors some times, and some times generates not unique selectors.
`finder` generates more shortest selectors than optimal-select. Also optimal-select now does not have tests and we have :)
 
For example, on github.com page:

|          | finder | optimal-select |
|----------|--------|----------------| 
| fails    | 0      | 42             |
| shortest | 404    | 38             | 
| longest  | `.story:nth-child(3) .d-lg-flex:nth-child(2) > .width-full:nth-child(1)` | `[class="circle d-flex flex-column flex-justify-center text-center p-4 mx-auto mt-6 mb-3 m-md-3 bg-orange box-shadow-extra-large"] [class="d-block f0-light text-white lh-condensed-ultra mb-2"]` |

## License

MIT
