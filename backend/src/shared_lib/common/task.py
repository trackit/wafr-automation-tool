from abc import ABC, abstractmethod


class Task[T, U](ABC):
    @abstractmethod
    def execute(self, event: T) -> U:
        raise NotImplementedError
