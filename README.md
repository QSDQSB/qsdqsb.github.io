
# QSD's Personal Site Project

## Origin

This git is originally forked from [Academic Pages](https://github.com/academicpages/academicpages.github.io), which was modified from the [Minimal Mistakes Jekyll Theme](https://mmistakes.github.io/minimal-mistakes/), which is © 2016 Michael Rose and released under the MIT License. See LICENSE.md

I can only say that the original Academic Page's documentation are code comments are extremely hard to read. It takes me much effort to modify it to my own version. Also it deleted some interesting section from the original Minimal Mistakes site, which I am gradually trying to add it back.

Moreover, some part of the code are written with an age over 5 years. I have been trying to update the code to fit with a newer CSS version and HTML standard for a better explorer experience and performance improvement.

## To run locally

1. Make sure you have ruby-dev, bundler, and nodejs installed: `sudo apt install ruby-dev ruby-bundler nodejs`
1. Run `bundle clean` to clean up the directory (no need to run `--force`)
1. Run `bundle install` to install ruby dependencies. If you get errors, delete Gemfile.lock and try again.
1. Run `bundle exec jekyll liveserve` to generate the HTML and serve it from `localhost:4000` the local server will automatically rebuild and refresh the pages on change.
