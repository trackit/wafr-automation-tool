#!/bin/bash
while :;
do
  git fetch;
  [ $(git rev-parse HEAD) != $(git rev-parse @{u}) ] && git pull --rebase --autostash && git push;
done
